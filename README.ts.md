# Project Overview
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GithubActions](https://github.com/paseo-network/bot/actions/workflows/checks.ts.yml/badge.svg)](https://github.com/paseo-network/bot/blob/master/.github/workflows/checks.ts.yaml)

This project is a blockchain-based application designed to slash account balances on a Paseo network. The primary functionality includes querying account balances, filtering accounts based on specific criteria, and performing forced transfers to recover tokens from accounts exceeding a defined balance threshold.


## Architectural Overview

The project is structured into several key modules, each responsible for different aspects of the application's functionality:

1. **Configuration (`config.ts`)**:
   - Manages the application's configuration settings, which are loaded from environment variables. This includes settings like chain decimals, balance thresholds, node URLs, and more.

2. **Logging (`logger.ts`)**:
   - Provides a logging mechanism using the `pino` library. The logging level can be configured via environment variables.

3. **GraphQL Queries (`queries.ts`)**:
   - Contains the GraphQL queries used to fetch account data from the blockchain. This includes the `balancesQuery` which retrieves account balances exceeding a specified threshold.

4. **Balance Management (`balances.ts`)**:
   - Handles the logic for querying account balances, loading a whitelist of accounts, and filtering accounts to determine the amounts to be slashed. It uses the GraphQL client to interact with the blockchain.

5. **Extrinsics (`extrinsics.ts`)**:
   - Defines the function for performing forced transfers on the blockchain. This includes both dry-run and actual transaction execution.

6. **Slash Account (`slashAccount.ts`)**:
   - Implements the main logic for the slashing process. It initializes the blockchain API, retrieves accounts exceeding the balance threshold, filters these accounts based on a whitelist, and performs the forced transfers.

7. **Entry Point (`index.ts`)**:
   - The main entry point of the application. It loads the environment variables, initiates the slashing process, and handles the application lifecycle (exit codes).


## Prerequisites

Before you can run this project, ensure you have the following installed on your machine:

1. **Node.js**: This project requires Node.js. You can download and install it from [Node.js official website](https://nodejs.org/). Ensure you have version 14.x or higher.

```sh
node -v
```

2. **Yarn**: This project uses Yarn as the package manager. You can install Yarn globally using npm:

```sh
npm install -g yarn
```

   Verify the installation by checking the Yarn version:

```sh
yarn -v
```

3. **Dependencies**: Once you have Node.js and Yarn installed, you need to install the project dependencies. Navigate to the project directory and run:

```sh
yarn install
```

4. **Earthly Installation**: Earthly is used for building and deploying containers in this project. Download and install Earthly from the [official website](https://earthly.dev/get-earthly).

5. **Environment Variables**: This project relies on several environment variables for configuration. Create a `.env` file in the root of the project and add the necessary variables as specified in the `config.ts` module. You can use the `.env.example` file as example.

6. **GraphQL Endpoint**: Ensure you have access to a GraphQL endpoint that provides the necessary blockchain data. This should be configured in your environment variables.

7. **Polkadot.js API**: The project uses the Polkadot.js API to interact with the blockchain. Ensure you have the necessary permissions and access to perform transactions on the network.


Once you have all the prerequisites set up, you can proceed to run the project as described in the subsequent sections.

## Building and Running the Project

Once you have all the prerequisites set up, follow these steps to build and run the project:

1. **Build the Project**: Compile the TypeScript code into JavaScript. This step is necessary to ensure that all TypeScript files are transpiled correctly.

```sh
yarn build
```

2. **Run the Project**: Execute the main entry point of the application. This will start the slashing process and handle the application lifecycle.

```sh
yarn start
```

3. **Running Tests**: To ensure that everything is working correctly, you can run the test suite. This project uses Jest for testing.

```sh
yarn test
```

By following these steps, you should be able to build, run, and test the project successfully. If you encounter any issues, refer to the logs for more details and ensure that all prerequisites are correctly set up.

## Code Quality and Tooling

To maintain high code quality and ensure that our codebase adheres to best practices, we use a variety of tools and scripts. Below is a description of the tooling we use for code quality, checks, and other related tasks:

1. **Prettier**: Prettier is an opinionated code formatter that helps maintain consistent code style across the project. You can format the code by running:

```sh
yarn format
```

2. **ESLint**: ESLint is a static code analysis tool used to identify problematic patterns found in JavaScript/TypeScript code. It helps in maintaining code quality and enforcing coding standards. We have configured ESLint with TypeScript support and some additional plugins. To lint the code, run:

```sh
yarn lint
```

   To automatically fix linting errors, you can run:

```sh
yarn lint:fix
```

3. **Jest**: Jest is a testing framework used to ensure the correctness of our code. It allows us to write unit tests and provides a robust environment for running them. To run the test suite, use:

```sh
yarn test
```

4. **TypeScript**: TypeScript is used to add static types to JavaScript, which helps in catching errors early during development. The TypeScript compiler (`tsc`) is used to transpile TypeScript code into JavaScript. To compile the project, run:

```sh
yarn build
```

5. **ts-node**: `ts-node` is used to run TypeScript code directly without precompiling, which is useful during development. We have scripts that utilize `ts-node` for various tasks, such as running the application in development mode:

```sh
yarn dev
```

By using these tools, we ensure that our codebase remains clean, maintainable, and free of common errors.


## Continuous Integration (CI)

To ensure the stability and quality of our codebase, we have set up Continuous Integration (CI) using GitHub Actions. Our CI pipeline automatically runs a series of checks every time new code is pushed to the repository. Specifically, we test the following:

1. **Linting**: We run ESLint to check for code quality and adherence to coding standards.
2. **Unit Tests**: We use Jest to run our suite of unit tests to ensure that our code behaves as expected.
3. **Build**: We compile the TypeScript code to ensure there are no type errors and that the code can be successfully built.

By automating these tests, we catch issues early and maintain a high standard of code quality throughout the development process.

4. **Dependabot**: Dependabot is a tool that helps you keep your dependencies up to date. It automatically checks for updates to the dependencies listed in your `package.json` file and creates pull requests to update them. This helps in maintaining the security and stability of the project by ensuring that you are using the latest versions of your dependencies.

5. **Earthly**: Earthly is a build automation tool that allows you to define your build processes in a repeatable and portable way. We use Earthly to manage our build pipelines, ensuring that builds are consistent across different environments. To run an Earthly build, use:

```sh
earthly --ci +all
```

By using these additional tools, we further enhance the maintainability and reliability of our codebase. Dependabot ensures that our dependencies are always up to date, while Earthly provides a robust framework for managing complex build processes.

