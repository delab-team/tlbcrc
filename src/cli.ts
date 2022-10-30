import * as fs from 'fs'
import { Command } from 'commander'
import * as packagejson from '../package.json'
import { TLbConstructorWithType, TLBCRCGenerator, MsgType } from './parser'

interface Options {
    filename?: string
    force?: string
    queryWord?: string
    responseWord?: string
}

let options: Options = {}
const version = `tlbcrc version: ${packagejson.version}`
const program = new Command()

program
    .name('tlbcrc')
    .description('CLI to perform op codes generation by tl-b')
    .version(version, '', 'output the current version number')
    .showHelpAfterError(true)
    .argument('<filename>', 'path to file with tl-b scheme')
    .option('-f, --force <string>', 'constructors, example: "query::burn,response::excesses"')
    .option('-q, --query-word <string>', 'set query word (default "query")')
    .option('-r, --response-word <string>', 'set response word (default "response")')
    .action((filename: string) => { options.filename = filename })

program.parse()
options = { ...options, ...program.opts() }

function splitForce (force: string): TLbConstructorWithType[] {
    const splited = force.split(',')
    const data: TLbConstructorWithType[] = []

    splited.forEach((s) => {
        const typeconst = s.split('::')
        if (typeconst.length !== 2) {
            throw new Error('invalid force param passed')
        }

        if (![ 'query', 'response' ].includes(typeconst[0])) {
            throw new Error(`invalid msg type "${typeconst[0]}", use "query" or "response"`)
        }

        data.push({
            name: typeconst[1],
            msgtype: <MsgType>typeconst[0]
        })
    })

    return data
}

function main () {
    const content = fs.readFileSync(options.filename, { encoding: 'utf-8' })
    const generator = new TLBCRCGenerator(content)

    generator.parse()

    const result = generator.generate({
        force: options.force ? splitForce(options.force) : [],
        queryWord: options.queryWord || undefined,
        responseWord: options.responseWord || undefined
    })

    console.log(result)
}

if (require.main === module) {
    main()
}
