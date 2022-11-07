module.exports = (plugin) => {
  plugin.contentTypes.file.schema.attributes = {
    ...plugin.contentTypes.file.schema.attributes,
    faceRecognitionIds: {
      type: 'string',
      configurable: false
    }
  }
  return plugin
}
