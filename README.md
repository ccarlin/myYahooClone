# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

To install project dependencies run:
### `npm install`

## Available Scripts

To start the server portion of this app run:
 ### `node server.js`

In the project directory, you can run:
 ### `npm start`

Runs the UI portion of the app in.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.


## Running with Docker Compose

This application can be built and run using Docker Compose. This setup includes both the client and server services.

**Prerequisites:**
*   Docker installed and running on your system.
*   Docker Compose installed (usually comes with Docker Desktop).

**Steps:**

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone https://github.com/ccarlin/myYahooClone.git
    cd <repository-directory>
    ```

2.  **Build and run the application:**
    Open a terminal in the project's root directory (where `docker-compose.yml` is located) and run:
    ```bash
    docker-compose up --build -d
    ```
    *   `--build`: Forces Docker Compose to build the images before starting the containers.
    *   `-d`: Runs the containers in detached mode (in the background).

3.  **Accessing the application:**
    *   The client (frontend) will be available at [http://localhost:3000](http://localhost:3000).
    *   The server API will be available at [http://localhost:5000](http://localhost:5000) (though you'll typically interact with it through the client).

4.  **Stopping the application:**
    To stop the running containers, execute:
    ```bash
    docker-compose down
    ```

5.  **Viewing logs:**
    To view the logs from the running containers:
    ```bash
    docker-compose logs -f
    ```
    Or for a specific service:
    ```bash
    docker-compose logs -f client
    docker-compose logs -f server
    ```

**Configuration:**
*   The server uses the `myyahoo.json` file for its configuration. This file is mounted directly from your project directory into the server container. Any changes you make to `myyahoo.json` locally will be reflected in the running server.
