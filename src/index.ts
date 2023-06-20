/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Router } from 'itty-router';

// now let's create a router (note the lack of "new")
const router = Router();

// Export a default object containing event handlers
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const botUrl = env.BOT_URL;
    if (botUrl == '') {
      return new Response('Bad request: Missing `BOT_URL` environment variable', { status: 400 });
    }

    const botPayload = (event: string, user: string, description: string, event_time: Date) =>
      new Object({
        msg_type: 'post',
        content: {
          post: {
            zh_cn: {
              title: `【Notice】${event}`,
              content: [
                [
                  {
                    tag: 'text',
                    text: user,
                  },
                ],
                [
                  {
                    tag: 'text',
                    text: description,
                  },
                ],
                [
                  {
                    tag: 'text',
                    text: dateString(new Date(event_time)),
                  },
                ],
              ],
            },
          },
        },
      });
    const urlString = request.url;

    return router
      .post('/notice', async (request) => {
        console.log(botUrl);
        const content = await request.json();

        const payload = botPayload(content.event, content.user, content.description, content.event_time);

        const larkResp = await fetch(botUrl, { method: 'POST', body: JSON.stringify(payload) });

        const larkRespBody = await larkResp.text();

        console.log(larkRespBody);

        return new Response(larkRespBody as any, { status: 200 });
      })
      .all('*', () => new Response(sample(urlString), { headers: new Headers({ 'Content-Type': 'text/html' }) }))
      .handle(request);
  },
};

const dateString = (d: Date) => d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes();

const sample = (urlString: string) => {
  const parsedUrl = new URL(urlString);

  const baseUrl = parsedUrl.protocol + '//' + parsedUrl.hostname;

  return `<h1>Sample</h1>
  <code>curl -X POST -H "Content-Type: application/json" -d '{"event": "New User","user":"wurui","event_time":"2023-02-16 11:05:10.651917 UTC", "description":"For testing"}' ${baseUrl}/notice</code>`;
};
