module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/faces/searches',
      handler: 'face-recognition.search',
      config: {
        policies: [],
      },
    }
  ]
}
