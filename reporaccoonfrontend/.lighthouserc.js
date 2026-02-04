module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],  // the URL to test
      startServerCommand: 'npm start',  // command to start the app
      numberOfRuns: 1,                  // run once
      settings: {
        chromeFlags: '--headless',      // run Chrome headless
      },
    },
    upload: {
      target: 'temporary-public-storage', // no server needed
    },
  },
};
