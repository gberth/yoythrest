import express, { Request, Response } from 'express'

const app = express()
const port = process.env.PORT || 8080

app.get('/', (_req: Request, res: Response) => {
    return res.send('Express Typescript on Vercel')
})

app.get('/ping', (_req: Request, res: Response) => {
    return res.send('pong 🏓')
})

app.post('/yts', (_req: Request, res: Response) => {
    console.log(_req)
    return res.send('yts' + _req)
})

app.listen(port, () => {
    return console.log(`Server is listening on ${port}`)
})