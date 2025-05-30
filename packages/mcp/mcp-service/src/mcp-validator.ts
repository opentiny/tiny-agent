import { v4 as uuidv4 } from 'uuid'

export class McpValidator {
  protected verifyCode?: string

  genVerifyCode = async () => {
    const nonceCode = uuidv4()
    this.verifyCode = nonceCode
    return nonceCode
  }

  async verify(code: string) {
    return this.verifyCode && this.verifyCode === code
  }

  clearVerifyCode() {
    this.verifyCode = undefined
  }
}
