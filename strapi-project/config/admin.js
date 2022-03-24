module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', '754013aa7f9f88c4a6624e44f2cc18c1'),
  },
});
