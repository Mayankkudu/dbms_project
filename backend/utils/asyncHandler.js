// Express 4 does not automatically forward rejected promises from async
// route handlers to the error middleware — an unhandled rejection here
// would otherwise hang the request. Wrap every async controller with this.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
