/**
 * @type {import('next').NextConfig}
 **/
module.exports = {
  // reactStrictMod: true,
  //   async redirects() {
  //     return [
  //       {
  //         source: '/contact/:aaa*',
  //         destination: '/form/:aaa*',
  //         permanent: false,
  //       },
  //     ];
  //   },
  //   async rewrites() {
  //     return [
  //       {
  //         source: '/api/something',
  //         destination: 'https://abcd.com/apiSite?apiKey=abcd',
  //         permanent: false,
  //       },
  //     ];
  //   },
  experimental: {
    reactMode: "concurrent",
    reactRoot: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

//  Ctc를 통해 query나 params 분석 가능
