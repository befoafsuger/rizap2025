import { createUserResponse } from '@/entities/users/users'
import useSWRMutation from 'swr/mutation'

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
    url: string,
    { arg }: { arg: CreateUserArgs }
  ): Promise<createUserResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${arg.accessToken}`,
      },
      body: JSON.stringify({
        id: arg.userId,
        displayName: arg.displayName,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  const { trigger, data, isMutating } = useSWRMutation('/users', createUser)

  return {
    trigger,
    data,
    isMutating,
  }
}
