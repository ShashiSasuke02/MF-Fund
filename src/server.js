import 'dotenv/config';
import app from './app.js';
import { initializeDatabase, closeDb } from './db/database.js';
import cacheService from './services/cache.service.js';

const PORT = process.env.PORT || 4000;

// Initialize database before starting server
try {
  initializeDatabase();
} catch (error) {
  console.error('[Server] Failed to initialize database:', error.message);
  process.exit(1);
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 MF Selection App Server                                  ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                               ║
║   API Endpoints:                                              ║
║   - GET  /api/health          Health check                    ║
║   - GET  /api/amcs            List all AMCs                   ║
║   - GET  /api/amcs/:id/funds  List funds by AMC               ║
║   - GET  /api/funds/:code     Fund details                    ║
║   - GET  /api/funds/search    Search funds                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Periodic cache cleanup (every 30 minutes)
const cacheCleanupInterval = setInterval(async () => {
  const cleared = await cacheService.clearExpired();
  if (cleared > 0) {
    console.log(`[Cache] Cleared ${cleared} expired entries`);
  }
}, 30 * 60 * 1000);

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
  
  // Clear interval
  clearInterval(cacheCleanupInterval);
  
  // Close server
  server.close(() => {
    console.log('[Server] HTTP server closed');
    
    // Close database
    try {
      closeDb();
    } catch (e) {
      console.error('[Server] Error closing database:', e.message);
    }
    
    console.log('[Server] Shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

export default server;
