import { env } from './config/env';
import { app } from './app';

app.listen(env.PORT, () => {
  console.log(`Backend Moustass listening on port ${env.PORT}`);
});