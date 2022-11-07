'use strict';
const faceapi = require('face-api.js')
const { Canvas, Image, ImageData, loadImage } = require('canvas')
faceapi.env.monkeyPatch({ Canvas, Image, ImageData })

function* chunks(arr, n) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n);
  }
}

const THRESHOLD = 0.6

module.exports = {
  async search(ctx, next) {
    const uploadedFile = ctx.request.files.file
    const image = await loadImage(uploadedFile.path)
    const faces = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const faceMatches = await Promise.all(faces.map(async (face) => {
      const { descriptor } = face
      const vectors = [...chunks(descriptor, 64)].map((vector) => {
        return vector.map(x => x.toString()).join(',')
      })
      const query = `SELECT id, image_id FROM vectors WHERE sqrt(power(CUBE(array[${vectors[0]}]) <-> vec_low, 2) + power(CUBE(array[${vectors[1]}]) <-> vec_high, 2)) <= ${THRESHOLD} ORDER BY sqrt(power(CUBE(array[${vectors[0]}]) <-> vec_low, 2) + power(CUBE(array[${vectors[1]}]) <-> vec_high, 2)) ASC`
      const faceRows = await strapi.db.connection.raw(query)
      return faceRows.rows
    }))
    const matchingImageIds = faceMatches.flat().map((faceMatch) => faceMatch.image_id )
    const matchingImages = await strapi.db.query('plugin::upload.file').findMany({
        where: {
          id: {
            $in: matchingImageIds
          }
        },
        orderBy: { createdAt: 'ASC'}
      })
    ctx.body = JSON.stringify({ matchingImages })
    return
  }
}
