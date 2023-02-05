# Monitoro w/ google oauth2

This little project provides a Docker image of [Monitoro](https://github.com/AbhilashJN/monitoro) that is ready to spin up.
You can use it to monitor your bull queues in a production environment thanks to the Google OAuth2 integration.

# Features

- Everything to is allowed by [Monitoro](https://github.com/AbhilashJN/monitoro)
- Restricted list of emails to can login

# Required environment variables

- `REDIS_URL`: the URL of the Redis instance the bull queues you want to monitor are linked to. Eg: `redis://localhost:6379`
- `BULL_QUEUES`: a comma-separated list of queues that you want to monitor. If one of your queues contains a commo, sorry :/ Eg: `process-thumbnails,healthcheck`. Defaults to empty.
- `GOOGLE_CLIENT_ID`: the OAuth2 client ID provided when you created the client on the Google console
- `GOOGLE_CLIENT_SECRET`: the OAuth2 client secret provided when you created the client on the Google console
- `HOST`: the host name that your app is available on.
    - The callback URL that you configure in the Google console must be `<the_host>/auth/google/callback`. Eg: `https://example.com/auth/google/callback`
    - The host you provide in the environment variable must be `<the_host>` without trailing slash. Eg: `https://example.com`
- `ALLOWED_EMAILS`: a comma-separated list of emails that are allowed to access the application. Eg: `rick@gmail.com,john@gmail.com,bernard@gmail.com`. Default to empty.
- `PORT`: the port to listen on. Defaults to `3000`.

# Setting up the development environment

```
npm install
# Fill the .env file with the required variables
npm start
```