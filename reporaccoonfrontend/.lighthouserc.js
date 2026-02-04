module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm start',
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless',
      },
    },
    upload: {
      target: 'temporary-public-storage', // no server needed
    },npx lhci autorun

  },
};
