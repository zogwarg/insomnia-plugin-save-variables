import { createVariableDefinitionHeader } from '../custom-header-format/variable-definition/variable-definition'
import { TemplateRunContext } from '../insomnia/types/template-context'
import { TemplateTag, LiveDisplayArg } from '../insomnia/types/template-tag'
import { log, LogLevel } from '../logger/log'
import { allValueExtractors } from '../value-extractors/all-value-extractors'
import { allValueSources } from '../value-sources/all-value-sources'

export const definitionTemplateTag: TemplateTag = {
  name: 'savevariable',
  displayName: 'Save Variable',
  description: 'save response value to a variable',
  liveDisplayName: (args: LiveDisplayArg[]) => {
    return `Save Variable - ${args[0].value}`
  },
  args: [
    {
      displayName: 'Variable Name',
      defaultValue: '',
      type: 'string',
    },
    {
      displayName: 'Source',
      type: 'enum',
      defaultValue: allValueSources[0].type,
      options: allValueSources.map(e => ({
        displayName: e.displayName,
        value: e.type,
      })),
    },
    {
      displayName: 'Extractor',
      type: 'enum',
      defaultValue: allValueExtractors[0].type,
      options: allValueExtractors.map(e => ({
        displayName: e.displayName,
        value: e.type,
      })),
    },
    {
      displayName: args => allValueExtractors.find(e => e.type === args[1].value)?.argumentName ?? '',
      defaultValue: '',
      type: 'string',
    },
  ],
  run: async (context: TemplateRunContext, ...args: unknown[]) => {
    if (args.length === 3) {
      return runLegacyTag(context, args)
    } else {
      return runTag(context, args)
    }
  },
}

const legacyLookup: Record<string, { source: string; extractor: string }> = {
  header: {
    source: 'responseHeader',
    extractor: 'static',
  },
  body: {
    source: 'responseBody',
    extractor: 'json',
  },
  bodyXml: {
    source: 'responseBody',
    extractor: 'xml',
  },
  static: {
    source: 'static',
    extractor: 'static',
  },
}

export function runLegacyTag(context: TemplateRunContext, args: unknown[]): string {
  const variableName = args[0] as string
  const type = args[1] as string
  const arg = args[2] as string
  const { source, extractor } = legacyLookup[type]

  const sourceName = allValueSources.find(s => s.type === source)?.displayName ?? source
  const extractorName = allValueExtractors.find(e => e.type === extractor)?.displayName ?? extractor

  const message = `insomnia-plugin-save-variables has a breaking change! Please migrate to the new fields with these instructions:

1. Save these instructions so that you don't lose them while following the remaining steps.
2. Select "${sourceName}" in the "Source" field above.
3. Select "${extractorName}" in the "Extractor" field above.
4. Enter "${arg}" in the remaining field above.
`
  log(LogLevel.WARN, `Save Variable - ${variableName}\n${message}`)
  return message
}

export function runTag(context: TemplateRunContext, args: unknown[]): string {
  const variableName = args[0] as string
  const source = args[1] as string
  const extractor = args[2] as string
  const arg = args[3] as string
  const workspaceId = context.meta.workspaceId
  return createVariableDefinitionHeader({ variableName, source, extractor, arg, workspaceId })
}
