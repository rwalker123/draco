import { Request, Application } from 'express';
import { Container } from '../container/index.js';

export interface AppWithContainer extends Application {
  locals: {
    container: Container;
  };
}

export interface RequestWithContainer extends Request {
  app: AppWithContainer;
}
