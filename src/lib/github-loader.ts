import {GithubRepoLoader} from '@langchain/community/document_loaders/web/github'

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(githubUrl, {
        accessToken:githubToken ?? '',
        branch:'main',
        ignoreFiles:['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml','bun-lockb' ],
        recursive:true,
        unknown:'warn',
        maxConcurrency:5
    })
    const docs = await loader.load();

    return docs;
}

console.log(await loadGithubRepo("https://github.com/NITINKUMAWAT0/URL-SHORTENER-APPLICATION"));

// Document {
//     pageContent: '\n' +
//       'const NotFound = () => {\n' +
//       '    return (\n' +
//       '      <div>\n' +
//       '        <h1>404 not found</h1>\n' +
//       '      </div>\n' +
//       '    )\n' +
//       '  }\n' +
//       '  \n' +
//       '  export default NotFound\n' +
//       '  ',
//     metadata: {
//       source: 'url-shortener-frontend/src/Pages/NotFound/NotFound.jsx',
//       repository: 'https://github.com/NITINKUMAWAT0/URL-SHORTENER-APPLICATION',
//       branch: 'main'
//     },
//     id: undefined
//   }