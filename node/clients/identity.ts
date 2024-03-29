import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

export default class IdentityClient extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
      },
    })
  }

  public async validateToken({ token }: { token: any }): Promise<any> {
    return this.http.post(`/api/vtexid/credential/validate`, { token })
  }
}
