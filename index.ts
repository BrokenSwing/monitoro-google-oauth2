import Express from "express";
// @ts-ignore
import monitoro from "monitoro";
import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import { randomBytes } from "crypto";

dotenv.config();

function retrieveQueues(): { name: string; hostId: string; url: string }[] {
  const commaSeparatedQueues = process.env.BULL_QUEUES || "";
  const queuesNames = commaSeparatedQueues.split(",");
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw Error(
      "You MUST at least specify the environment variable REDIS_URL which points to the redis instance your queues are in"
    );
  }

  return queuesNames.map((name) => ({
    name,
    hostId: "redis",
    url: redisUrl,
  }));
}

function retrieveGoogleCreds(): {
  clientId: string;
  clientSecret: string;
  domain: string;
} {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const domain = process.env.HOST;
  if (googleClientId && googleClientSecret && domain) {
    return {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      domain,
    };
  }
  throw new Error(
    "You must specify environement variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and HOST"
  );
}

function getAllowedEmails(): string[] {
  const allowedEmails = process.env.ALLOWED_EMAILS || "";
  return allowedEmails.split(",");
}

function getSessionsSecret(): string {
  return process.env.SESSIONS_SECRET || randomBytes(48).toString("hex");
}

const creds = retrieveGoogleCreds();
const emails = getAllowedEmails();
passport.use(
  new GoogleStrategy(
    {
      clientID: creds.clientId,
      clientSecret: creds.clientSecret,
      callbackURL: `${creds.domain}/auth/google/callback`,
      passReqToCallback: true,
    },
    function (
      _request: any,
      _accessToken: any,
      _refreshToken: any,
      profile: any,
      done: any
    ) {
      if (emails.includes(profile.email)) {
        // Success
        done(null, profile.sub);
      } else {
        // Failure
        done(null, false);
      }
    }
  )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((id: string, done) => done(null, id));

const app = Express();
app.locals.MonitoroQueues = retrieveQueues();

app.set("trust proxy", 1);
app.use(
  session({
    secret: getSessionsSecret(),
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 3600 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.get("/auth/google", passport.authenticate("google", { scope: ["email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successReturnToOrRedirect: "/",
    failureMessage: "You're not authorized to login on this server",
  })
);
app.use(
  "/",
  (req, res, next) => {
    if (!req.user) {
      res.redirect("/auth/google");
    } else {
      next();
    }
  },
  monitoro
);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
