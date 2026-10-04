<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/417ec848-2990-409c-99c8-686fc1e40b51

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GROQ_API_KEY` in [.env.local](.env.local) to your Groq API key (or use your shell environment / app secrets).
3. Optionally set `PORT` if port 3000 is already in use.
4. Run the app:
   `npm run dev`
