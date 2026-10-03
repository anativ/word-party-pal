import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

// External API for managing words and verbs.
// Fully public — no API key required. Be nice. :)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const wordSchema = z.object({
  id: z.string().uuid().optional(),
  english: z.string().trim().min(1).max(255),
  hebrew: z.string().trim().min(1).max(255),
})

const verbSchema = z.object({
  id: z.string().uuid().optional(),
  hebrew: z.string().trim().min(1).max(255),
  past: z.string().trim().min(1).max(255),
  present: z.string().trim().min(1).max(255),
})

const bodySchema = z.object({
  table: z.enum(['words', 'verbs']),
  action: z.enum(['insert', 'update', 'upsert', 'delete']),
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(1000),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Server is not configured (missing database credentials).' }, 500)
  }

  // --- Body validation ---
  let parsedBody: z.infer<typeof bodySchema>
  try {
    const raw = await req.json()
    const result = bodySchema.safeParse(raw)
    if (!result.success) {
      return json({ error: 'Invalid request body.', details: result.error.flatten() }, 400)
    }
    parsedBody = result.data
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400)
  }

  const { table, action } = parsedBody
  const itemSchema = table === 'words' ? wordSchema : verbSchema

  // Validate every item against the table's shape
  const validated: z.infer<typeof wordSchema | typeof verbSchema>[] = []
  const itemErrors: { index: number; errors: unknown }[] = []
  parsedBody.items.forEach((item, index) => {
    const result = itemSchema.safeParse(item)
    if (result.success) validated.push(result.data)
    else itemErrors.push({ index, errors: result.error.flatten() })
  })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    let inserted = 0
    let updated = 0
    let deleted = 0

    if (action === 'delete') {
      // For delete, items only need an id
      const ids: string[] = []
      const deleteErrors: { index: number; errors: unknown }[] = []
      parsedBody.items.forEach((item, index) => {
        const result = z.object({ id: z.string().uuid() }).safeParse(item)
        if (result.success) ids.push(result.data.id)
        else deleteErrors.push({ index, errors: result.error.flatten() })
      })
      if (ids.length > 0) {
        const { error, count } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .in('id', ids)
        if (error) return json({ error: error.message }, 500)
        deleted = count ?? ids.length
      }
      return json({ table, action, deleted, errors: deleteErrors })
    }

    if (validated.length > 0) {
      if (action === 'insert') {
        const toInsert = validated.map(({ id: _id, ...rest }) => rest)
        const { error } = await supabase.from(table).insert(toInsert)
        if (error) return json({ error: error.message, details: itemErrors.length ? itemErrors : undefined }, 500)
        inserted = toInsert.length
      } else if (action === 'update') {
        // Every item must include an id for update
        const withIds = validated.filter((it) => 'id' in it && it.id)
        if (withIds.length !== validated.length) {
          return json({ error: 'Every item in an "update" action must include an "id".' }, 400)
        }
        const results = await Promise.all(
          withIds.map(async ({ id, ...rest }) => {
            const { error } = await supabase.from(table).update(rest).eq('id', id as string)
            return error
          })
        )
        const firstError = results.find(Boolean)
        if (firstError) return json({ error: firstError.message }, 500)
        updated = withIds.length
      } else {
        // upsert: update when an id is present, insert otherwise
        const withIds = validated.filter((it) => 'id' in it && it.id) as (typeof wordSchema._output)[]
        const withoutIds = validated
          .filter((it) => !('id' in it && it.id))
          .map(({ id: _id, ...rest }) => rest)

        if (withIds.length > 0) {
          const results = await Promise.all(
            withIds.map(async ({ id, ...rest }) => {
              const { error } = await supabase.from(table).update(rest).eq('id', id as string)
              return error
            })
          )
          const firstError = results.find(Boolean)
          if (firstError) return json({ error: firstError.message }, 500)
          updated = withIds.length
        }
        if (withoutIds.length > 0) {
          const { error } = await supabase.from(table).insert(withoutIds)
          if (error) return json({ error: error.message }, 500)
          inserted = withoutIds.length
        }
      }
    }

    return json({
      table,
      action,
      inserted,
      updated,
      invalidItems: itemErrors.length ? itemErrors : undefined,
    })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500)
  }
})
