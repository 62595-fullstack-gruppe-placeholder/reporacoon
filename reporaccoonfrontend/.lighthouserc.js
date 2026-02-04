module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 1,
      startServerCommand: 'npm start',
      startServerReadyPattern: 'Listening on',
      chromeFlags: '--headless'
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
