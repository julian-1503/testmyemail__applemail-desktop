import dotenv from 'dotenv';
dotenv.config();

import container from './inversify.config';
import { TYPES } from '@applemail/config/src/inversify.types';
import { Orchestrating, AppEvents, handleStateChange } from './orchestrating';
import { validateEnv } from '@applemail/lib/src/utils';

validateEnv(process.env);

const app = container.get<Orchestrating>(TYPES.Orchestrator);

app.on(AppEvents.StateTransition, handleStateChange(app));

app.run();
