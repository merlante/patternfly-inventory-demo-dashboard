# patternfly-inventory-demo-dashboard

This dashboard is the component that provides the visual "front door" to the kafka inventory demo app. It's a Patternfly app running in a web browser that retrieves and displays topic messages from the TOPICS_WEBSOCKET_ENDPOINT uri. It is also intended to be extendable to provide other actions to simulate inventory movement events.

The dashboard is a single page browser app that is served statically from a web server. A dockerfile is provided (see below) for creating a container based on nginx that serves the webpack bundle.

This demo dashboard is based on the Patternfly Seed (https://github.com/patternfly/patternfly-react-seed), which is an open source build scaffolding utility for web apps.

## Development quick-start

The dashboard will only display data when https://github.com/merlante/quarkus-kafka-inventory-demo is running. See there for running instructions. If quarkus-kafka-inventory-demo comes up after the dashboard single page app loads in the browser, the dashboard window will need to be refreshed.

```bash
git clone https://github.com/merlante/patternfly-inventory-demo-dashboard.git
cd patternfly-inventory-demo-dashboard
npm install && npm run start:dev
```
Yarn works as well. i.e.
```bash
yarn run start:dev
```

In a browser:
```bash
http://localhost:9000
```

## Quick-start for prod with containers

Webpack build:
```bash
yarn build
```

Building container image with webpack dist on nginx image:

```bash
docker build -f src/docker/Dockerfile -t [repo_name]patternfly-inventory-demo-dashboard .
```

Running on docker:
```bash
docker run --rm -d -p 9000:8080 [repo_name]patternfly-inventory-demo-dashboard
```

In a browser:
```bash
http://localhost:9000
```

## Development scripts
```sh
# Install development/build dependencies
npm install

# Start the development server
npm run start:dev

# Run a production build (outputs to "dist" dir)
npm run build

# Run the test suite
npm run test

# Run the linter
npm run lint

# Run the code formatter
npm run format

# Launch a tool to inspect the bundle size
npm run bundle-profile:analyze

# Start the express server (run a production build first)
npm run start

# Start storybook component explorer
npm run storybook

# Build storybook component explorer as standalone app (outputs to "storybook-static" dir)
npm run build:storybook
```

## Configurations
* [TypeScript Config](./tsconfig.json)
* [Webpack Config](./webpack.common.js)
* [Jest Config](./jest.config.js)
* [Editor Config](./.editorconfig)

## Raster image support

To use an image asset that's shipped with PatternFly core, you'll prefix the paths with "@assets". `@assets` is an alias for the PatternFly assets directory in node_modules.

For example:
```js
import imgSrc from '@assets/images/g_sizing.png';
<img src={imgSrc} alt="Some image" />
```

You can use a similar technique to import assets from your local app, just prefix the paths with "@app". `@app` is an alias for the main src/app directory.

```js
import loader from '@app/assets/images/loader.gif';
<img src={loader} alt="Content loading />
```

## Vector image support
Inlining SVG in the app's markup is also possible.

```js
import logo from '@app/assets/images/logo.svg';
<span dangerouslySetInnerHTML={{__html: logo}} />
```

You can also use SVG when applying background images with CSS. To do this, your SVG's must live under a `bgimages` directory (this directory name is configurable in [webpack.common.js](./webpack.common.js#L5)). This is necessary because you may need to use SVG's in several other context (inline images, fonts, icons, etc.) and so we need to be able to differentiate between these usages so the appropriate loader is invoked.
```css
body {
  background: url(./assets/bgimages/img_avatar.svg);
}
```

## Adding custom CSS
When importing CSS from a third-party package for the first time, you may encounter the error `Module parse failed: Unexpected token... You may need an appropriate loader to handle this file typ...`. You need to register the path to the stylesheet directory in [stylePaths.js](./stylePaths.js). We specify these explicity for performance reasons to avoid webpack needing to crawl through the entire node_modules directory when parsing CSS modules.

## Code quality tools
* For accessibility compliance, we use [react-axe](https://github.com/dequelabs/react-axe)
* To keep our bundle size in check, we use [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
* To keep our code formatting in check, we use [prettier](https://github.com/prettier/prettier)
* To keep our code logic and test coverage in check, we use [jest](https://github.com/facebook/jest)
* To ensure code styles remain consistent, we use [eslint](https://eslint.org/)
* To provide a place to showcase custom components, we integrate with [storybook](https://storybook.js.org/)

## Multi environment configuration
This project uses [dotenv-webpack](https://www.npmjs.com/package/dotenv-webpack) for exposing environment variables to your code. Either export them at the system level like `export MY_ENV_VAR=http://dev.myendpoint.com && npm run start:dev` or simply drop a `.env` file in the root that contains your key-value pairs like below:

```sh
ENV_1=http://1.myendpoint.com
ENV_2=http://2.myendpoint.com
```

With that in place, you can use the values in your code like `console.log(process.env.ENV_1);`
