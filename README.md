# CozyCast ✍️

A beautiful yet comprehensive Farcaster client with an option to add multiple filter
Built as an open source example for FarcasterKit x Neynar using LiteCast

### Built with

-   [Expo](https://expo.dev)
-   FarcasterKit's [farcasterkit-react-native](https://www.npmjs.com/package/farcasterkit-react-native)
- Neynar's [react-native-signin](https://www.npmjs.com/package/@neynar/react-native-signin)


### How to run

1. Set up the app locally

-   `git clone https://github.com/vidhathat/cozycast.git`
-   `cd cozycast && yarn install`

2. Set environment variables

-   Copy `.env.example` to a new `.env` file and add your `NEYNAR_API_KEY`
-   In `constants.ts`, the `API_URL` value is for FarcasterKit's API, which has routes to get/receive the signer and post casts to Neynar. Don't change this value you're running the FarcasterKit API locally, but if not change the value to `http://api.farcasterkit.com`
- Set the same values you have in your `.env` file in `eas.json` under the env sections for development and preview

3. Create Expo project

-   To run the app locally, you'll need to create an account at `https://expo.dev`, then create a new project
-   Once you've created a project, run `npm install --global eas-cli && eas init --id [YOUR PROJECT ID]` to overwrite the existing project with your own

4. Run by calling `yarn start`


### Mockups

Here are some mockups to further showcase where the app is headed -- huge shoutout again to [Sirsu](https://warpcast.com/sirsu) for the amazing designs 🙌

|                       Onboarding                        |                       Home                        |
| :------------------------------------------------: | :-----------------------------------------------: |
| ![Cozycast Onboarding](https://i.ibb.co/XLGXTrL/cozy1.jpg)     | ![Cozycast Home](https://i.ibb.co/rHZvpwj/cozy4.jpg) |

|                       Filter List                        |                       Filter List                        |
| :-------------------------------------------------: | :------------------------------------------------: |
| ![Cozycast filters](https://i.ibb.co/6HQc5Pv/cozy5.jpg) | ![Cozycast filters](https://i.ibb.co/8bCNThR/cozy3.jpg) |
