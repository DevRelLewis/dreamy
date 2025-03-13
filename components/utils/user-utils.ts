'use client'

import { supabase } from '@/supabase/supabaseClient'

type KindeUser = {
  id: string
  email: string | null
  given_name: string | null
  family_name: string | null
  picture?: string | null
}

/**
 * Checks if a user exists in Supabase database and creates one if they don't
 */
export async function syncUserWithDatabase(kindeUser: KindeUser) {
  try {
    if (!kindeUser?.email) {
      console.error('Kinde user email is missing')
      return null
    }

    // Check for existing user by email
    const { data: existingUserByEmail, error: emailSearchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', kindeUser.email.toLowerCase())
      .single()

    if (emailSearchError && emailSearchError.code !== 'PGRST116') {
      console.error('Error checking for existing user by email:', emailSearchError)
    }

    // If found user by email, update their Kinde ID if needed
    if (existingUserByEmail) {
      if (!existingUserByEmail.kinde_user_id || existingUserByEmail.kinde_user_id !== kindeUser.id) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            kinde_user_id: kindeUser.id,
            first_name: kindeUser.given_name || existingUserByEmail.first_name,
            last_name: kindeUser.family_name || existingUserByEmail.last_name,
            avatar_url: kindeUser.picture || existingUserByEmail.avatar_url
          })
          .eq('id', existingUserByEmail.id)

        if (updateError) {
          console.error('Error updating user with Kinde ID:', updateError)
        }
      }
      return existingUserByEmail
    }

    // Check for existing user by Kinde ID
    const { data: existingUserById, error: idSearchError } = await supabase
      .from('users')
      .select('*')
      .eq('kinde_user_id', kindeUser.id)
      .single()

    if (idSearchError && idSearchError.code !== 'PGRST116') {
      console.error('Error checking for existing user by Kinde ID:', idSearchError)
    }

    // If found user by Kinde ID, update their email if needed
    if (existingUserById) {
      if (existingUserById.email !== kindeUser.email) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            email: kindeUser.email.toLowerCase(),
            first_name: kindeUser.given_name || existingUserById.first_name,
            last_name: kindeUser.family_name || existingUserById.last_name,
            avatar_url: kindeUser.picture || existingUserById.avatar_url
          })
          .eq('id', existingUserById.id)

        if (updateError) {
          console.error('Error updating user email:', updateError)
        }
      }
      return existingUserById
    }

    // Create new user if none exists
    const newUser = {
      kinde_user_id: kindeUser.id,
      email: kindeUser.email.toLowerCase(),
      first_name: kindeUser.given_name || '',
      last_name: kindeUser.family_name || '',
      avatar_url: kindeUser.picture || '',
      token_balance: 250, // Default token balance
      tokens_spent: 0,
      is_subscribed: false
    }

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating new user:', insertError)
      return null
    }

    return insertedUser
  } catch (err) {
    console.error('Exception in syncUserWithDatabase:', err)
    return null
  }
}

/**
 * Fetches the current user data from Supabase based on Kinde user information
 */
export async function getCurrentUserData(kindeUser: KindeUser | null) {
  if (!kindeUser || !kindeUser.email) {
    return null
  }
  
  try {
    // Try to find user by Kinde ID
    const { data: userByKindeId, error: kindeIdError } = await supabase
      .from('users')
      .select('*')
      .eq('kinde_user_id', kindeUser.id)
      .single()
    
    if (!kindeIdError && userByKindeId) {
      return userByKindeId
    }
    
    // If not found by Kinde ID, try by email
    const { data: userByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', kindeUser.email.toLowerCase())
      .single()
    
    if (!emailError && userByEmail) {
      // Update the Kinde ID if it's missing
      if (!userByEmail.kinde_user_id) {
        await supabase
          .from('users')
          .update({ kinde_user_id: kindeUser.id })
          .eq('id', userByEmail.id)
      }
      return userByEmail
    }
    
    // If user doesn't exist at all, create a new one
    return await syncUserWithDatabase(kindeUser)
  } catch (error) {
    console.error('Error fetching current user data:', error)
    return null
  }
}