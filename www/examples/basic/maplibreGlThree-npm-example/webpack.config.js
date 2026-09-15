import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import CopyPlugin from 'copy-webpack-plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export default {
    entry: './src/script.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs'),
                    to: 'maplibre-gl-worker.mjs',
                },
                {
                    from: require.resolve('maplibre-gl/dist/maplibre-gl-shared.mjs'),
                    to: 'maplibre-gl-shared.mjs',
                },
                {
                    from: path.resolve(__dirname, 'assets/110_above_sea.png'),
                    to: 'datasets/height-mock/110_above_sea.png',
                },
            ],
        }),
    ],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.ts$/i,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devServer: {
        static: [
            {
                directory: __dirname,
            },
            {
                directory: path.resolve(__dirname, 'dist'),
                publicPath: '/',
            },
        ],
        port: 8080,
    },
};
