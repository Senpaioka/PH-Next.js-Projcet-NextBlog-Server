This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

# NextBlog - A blogging SPA

Preview: https://ph-next-js-projcet-next-blog-client.vercel.app/

## Short Project Description

NextBlog is a modern, responsive blogging platform built with Next.js, Tailwind CSS, and DaisyUI. Users can create, update, delete, and bookmark blogs. Blogs support Markdown content, live previews, and categories. Authentication is handled via Firebase, and the backend uses Node.js with MongoDB to store blogs and user data. The platform also includes search, category filters, and personalized user dashboards.

## Tech Stack

### Front-end (Client)
Next.js, React, Tailwindcss, DaisyUI, Firebase, React-Editor, React-Icons, React-toastify

### Backend (Server)
Express.js, MongoDB, Firebase-Admin


## Deployed 
    * Frontend -> Vercel
    * Backend -> Vercel


## Getting Started

First, Clone the NextBlog-Client repo from github:

```bash
git clone https://github.com/Senpaioka/PH-Next.js-Projcet-NextBlog-Client.git
# then
cd nextblog

```

Second, setup .env file:

```bash
# firebase key
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# backed api
NEXT_PUBLIC_BASE_URL=
```


Lastly , run the development server:

```bash
npm install
# then
npm run dev

```
## Setup Express.js Sever

First, Clone the NextBlog-Server repo from github:

```bash
git clone https://github.com/Senpaioka/PH-Next.js-Projcet-NextBlog-Server.git

```

Second, setup .env file:

```bash
# key and port
PORT = 
MONGODB_URL = 

# setup firebase admin-sdk-secret-keys
...
```


Lastly , run the development server:

```bash
npm install
# then
nodemon server.js

```


Open [http://localhost:3000](http://localhost:3000) with your browser to see the front-end.

Open [http://localhost:5000](http://localhost:5000) with your browser to see the express.js server. [if port set to 5000]


## Route Summery

| Route                   | Method | Description                                         |
| ----------------------- | ------ | --------------------------------------------------- |
| `/`                     | GET    | Home page, displays featured and latest blogs       |
| `/articles`             | GET    | List of all articles with category & search filters |
| `/blog`          | POST   | Create a new blog (authenticated users only)        |
| `/update-blog/:blog_id` | PUT    | Update a blog (owner only)                          |
| `/blog/:blog_id`        | GET    | View a single blog detail page                      |
| `/my-blogs`             | GET    | List of blogs created by the logged-in user         |
| `/bookmarks`            | GET    | Get all bookmarked blogs for the user               |
| `/bookmark/:blog_id`    | POST   | Add a blog to bookmarks                             |
| `/delete-blog/:blog_id` | DELETE | Delete a blog (owner only)                          |
| `/contact`              | POST   | Submit contact form messages                        |



## Features:

* User authentication with Firebase
* Markdown blog editor with live preview
* Blog search and category filter
* Bookmark functionality
* Responsive design using Tailwind CSS and DaisyUI
* Loader/spinner for async actions
* User dashboard to manage own blogs


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
