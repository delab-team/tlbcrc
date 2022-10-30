import CRC32 from 'crc-32'

type MsgType = 'query' | 'response'

interface TLBDeclaration {
    constructor: string
    expression: string
}

interface TLbConstructorWithType {
    name: string
    msgtype: MsgType
}

interface GenerateOptions {
    force: TLbConstructorWithType[]
    queryWord?: string
    responseWord?: string
}

interface GenerateResult {
    crc32: string
    scheme: string
    msgtype: MsgType
}

class TLBCRCGenerator {
    private _content: string

    private _exps: TLBDeclaration[] = []

    constructor (content: string) {
        this._content = content
    }

    public get content (): string { return this._content }

    public parse (): void {
        const splited = this._content.split(';')

        splited.forEach((e) => {
            let exp: string = ''

            e.split('\n').forEach((e1) => {
                if (e1 !== '' && !e1.startsWith('//')) {
                    exp += ` ${e1} `
                }
            })

            if (exp !== '') {
                const rep = exp.replace(/  +/g, ' ')
                    .replaceAll('(', '')
                    .replaceAll(')', '')
                    .trim()
                    .split(' ')

                if (
                    !(rep[0][rep[0].length - 1] === '_'
                    || rep[0].includes('#') || rep[0].includes('$'))
                ) {
                    this._exps.push({
                        constructor: rep[0],
                        expression: rep.slice(1, rep.length).join(' ')
                    })
                }
            }
        })
    }

    public generate (options: GenerateOptions): GenerateResult[] {
        const { queryWord = 'query', responseWord = 'resp' } = options
        const result: GenerateResult[] = []

        this._exps.forEach((e) => {
            const forced = options.force
                .reduce((a, value) => ({ ...a, [value.name]: value.msgtype }), {})

            const isforce = options.force ? Object.keys(forced).includes(e.constructor) : false
            const isquery = e.constructor.includes(queryWord)

            if (isquery || e.constructor.includes(responseWord) || isforce) {
                const scheme = e.constructor + ' ' + e.expression
                const typeNotForced = isquery ? 'query' : 'response'
                const typemsg: MsgType = isforce ? forced[e.constructor] : typeNotForced

                const crc = typemsg === 'query'
                    ? CRC32.str(scheme) & 0x7fffffff
                    : CRC32.str(scheme) | 0x80000000

                result.push({ crc32: `0x${(crc >>> 0).toString(16)}`, scheme, msgtype: typemsg })
            }
        })

        return result
    }
}

export { TLBCRCGenerator, GenerateOptions, GenerateResult, TLbConstructorWithType }
export type { MsgType }
