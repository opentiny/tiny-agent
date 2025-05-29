import { v4 as uuidv4 } from 'uuid';

export class McpValidator {
  protected verifyCode!: string;

  genVerifyCode = async () => {
    const nonceCode = uuidv4();
    this.verifyCode = nonceCode;
    return nonceCode;
  };

  async verify(code: string) {
    const isVerified = this.verifyCode === code;
    this.verifyCode = '';
    return isVerified;
  }
}
