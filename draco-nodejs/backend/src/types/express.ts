import { Request, Application } from 'express';
import { Container } from '../container';

export interface AppWithContainer extends Application {
  locals: {
    container: Container;
  };
}

export interface RequestWithContainer extends Request {
  app: AppWithContainer;
}
