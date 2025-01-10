/* Jest Setup Configuration */

// This is to fix an issue with test leaks related to createStateSyncMiddleware() in jsdom
process.env.GMS_DISABLE_REDUX_STATE_SYNC = 'true';
