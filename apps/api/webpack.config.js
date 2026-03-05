module.exports = function (options, webpack) {
  return {
    ...options,
    externals: {
      bcrypt: 'commonjs bcrypt',
      '@prisma/client': 'commonjs @prisma/client',
      'class-transformer': 'commonjs class-transformer',
      'class-validator': 'commonjs class-validator',
    },
    module: {
      rules: [
        ...options.module.rules,
        {
          test: /\.(html|node)$/,
          loader: 'ignore-loader',
        },
      ],
    },
    resolve: {
      ...options.resolve,
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
    optimization: {
      ...options.optimization,
      minimize: false,
    },
  };
};
