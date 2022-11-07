'use strict';
const faceapi = require('face-api.js')
const { Canvas, Image, ImageData, loadImage } = require('canvas')
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

async function loadModels() {
  await faceapi.nets.faceRecognitionNet.loadFromDisk(__dirname + "/face_models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk(__dirname + "/face_models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(__dirname + "/face_models");
}

async function getFaceIds(event, strapi) {
  const image = await loadImage(`${event.params.data.tmpWorkingDirectory}/${event.params.data.formats.large.hash}`)
  const faces = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
  const faceIds = await Promise.all(faces.map(async (face) => {
    const { descriptor } = face
    const vectors = [...chunks(descriptor, 64)].map((vector) => {
      return vector.map(x => x.toString()).join(',')
    })
    const query = `INSERT INTO vectors (image_id, vec_low, vec_high) VALUES (${event.result.id}, CUBE(array[${vectors[0]}]), CUBE(array[${vectors[1]}])) RETURNING id`
    const faceId = await strapi.db.connection.raw(query)
    return faceId.rows[0].id
  }))
  return faceIds
}

module.exports = async ({ strapi }) => {
  // Set up extension for working with cubes and table to store face vectors
  await strapi.db.connection.raw('create extension if not exists cube;')
  await strapi.db.connection.raw('create table if not exists vectors (id serial, image_id numeric, vec_low cube, vec_high cube);')
  await strapi.db.connection.raw('create index if not exists vectors_vec_idx on vectors(vec_low, vec_high);')
  await loadModels()

  strapi.db.lifecycles.subscribe({
    models: ['plugin::upload.file'],
    async afterCreate(event) {
      if (event.params.data.mime.indexOf('image/') > -1) {
        try {
          const faceIds = await getFaceIds(event, strapi)
          const updated = await strapi.db.query('plugin::upload.file').update({
            where: { id: event.result.id },
            data: {
              faceRecognitionIds: faceIds.join(', ')
            }
          })
          strapi.log.debug(`updated record ${updated.ids} with face recognition id ${updated.faceRecognitionIds}`)
        } catch (error) {
          strapi.log.error('Failed to process faces')
        }
      }
    }
  })
};
