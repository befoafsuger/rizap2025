import { createUserResponse } from '@/entities/users/users'
import useSWRMutation from 'swr/mutation'
import { client } from '@/hono/client.mts'

interface CreateUserArgs {
  userId: string
  displayName: string
  accessToken: string
}

interface UseCreateUser {
  trigger: (args: CreateUserArgs) => Promise<createUserResponse>
  data: createUserResponse | undefined
  isMutating: boolean
}

export function useCreateUser(): UseCreateUser {
  async function createUser(
    _url: string,
    { arg }: { arg: CreateUserArgs }
  ): Promise<createUserResponse> {
    const res = await client.api.users.$post(
      {
        json: {
          displayName: arg.displayName,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${arg.accessToken}`,
        },
      }
    )

    return res.json()
  }

  const { trigger, data, isMutating } = useSWRMutation('/users', createUser)

  return {
    trigger,
    data,
    isMutating,
  }
}
