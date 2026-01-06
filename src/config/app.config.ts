import { SESSION_MAX_AGE } from '@constants';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { CookieOptions } from 'express';
import { loadEnv } from 'src/doppler';

loadEnv();

export enum Environment {
  development = 'development',
  production = 'production',
  localhost = 'localhost',
}

/**
 * Interface for app configuration properties
 */
interface IConfig {
  origin: CorsOptions['origin'];
  cookie: CookieOptions;
  environment: Environment;
  enableSwagger: boolean;
}

type IConfigs = {
  [key in Environment]: IConfig;
};

export const Origins = {
  domain: '*.nguyenconggioi.tech',
};

/**
 * Configuration settings for different environments
 */
const configs: IConfigs = {
  [Environment.development]: {
    origin: [Origins.domain],
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: SESSION_MAX_AGE,
      sameSite: 'lax',
      domain: 'localhost',
    },
    environment: Environment.development,
    enableSwagger: false,
  },

  [Environment.production]: {
    origin: [Origins.domain],
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: SESSION_MAX_AGE,
      sameSite: 'lax',
      domain: '.nguyenconggioi.tech',
    },
    environment: Environment.production,
    enableSwagger: true,
  },

  [Environment.localhost]: {
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: SESSION_MAX_AGE,
      sameSite: 'lax',
      domain: 'localhost',
    },
    origin: /.*/,
    environment: Environment.localhost,
    enableSwagger: true,
  },
};

/**
 * Build app configuration based on the environment variable or default to localhost if not set or invalid value is provided for the environment variable
 * @returns app configuration based on the environment
 */
export const buildConfig = (): IConfig => {
  const env = process.env.ENVIRONMENT as Environment;
  const environment = env || Environment.localhost;
  return configs[environment];
};
