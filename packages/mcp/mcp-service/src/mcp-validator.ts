import { v4 as uuidv4 } from 'uuid';

export class McpValidator {
  protected verifyCode!: string;

  genVerifyCode() {
    const genCode = () => {
      const nonceCode = uuidv4();
      this.verifyCode = nonceCode;
      return nonceCode;
    };

    return genCode();
  }

  verify(code: string) {
    return this.verifyCode === code;
  }
}
