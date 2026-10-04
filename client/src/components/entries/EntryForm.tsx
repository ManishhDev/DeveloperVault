import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBlocker } from 'react-router';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import {
  entryCreateSchema,
  LANGUAGES,
  LIMITS,
  type CategoryWithCount,
  type Entry,
  type EntryCreate,
  type EntryCreateInput,
} from '@devvault/shared';
import { ApiError } from '../../api/client';
import { useTags } from '../../api/entries';
import { LANGUAGE_LABELS } from '../../lib/languages';
import { Button, ButtonLink } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { inputClass } from '../ui/styles';
import { ConfirmDialog } from '../ui/Modal';
import { Kbd } from '../ui/Kbd';
import { TagInput } from './TagInput';
import { cn } from '../../lib/utils';

interface EntryFormProps {
  categories: CategoryWithCount[];
  defaultValues: EntryCreateInput;
  submitLabel: string;
  cancelTo: string;
  onSubmit: (values: EntryCreate) => Promise<Entry>;
  onSaved: (entry: Entry) => void;
}

export function EntryForm({
  categories,
  defaultValues,
  submitLabel,
  cancelTo,
  onSubmit,
  onSaved,
}: EntryFormProps) {
  const { data: tags = [] } = useTags();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(entryCreateSchema),
    defaultValues: {
      description: '',
      sourceUrl: '',
      tags: [],
      language: 'text',
      isFavorite: false,
      ...defaultValues,
    },
  });

  /* ----- leaving with unsaved changes ----- */
  const saved = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !saved.current && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  useEffect(() => setFocus('title'), [setFocus]);

  const submit = handleSubmit(async (values) => {
    try {
      const entry = await onSubmit(values);
      saved.current = true;
      toast.success('Entry saved');
      onSaved(entry);
    } catch (err) {
      if (err instanceof ApiError && err.details.length) {
        for (const d of err.details) {
          setError(d.path.split('.')[0] as keyof EntryCreateInput, { message: d.message });
        }
      }
      toast.error(err instanceof Error ? err.message : 'Could not save the entry');
    }
  });

  /* ----- the content box keeps Tab (Esc, then Tab, moves on) ----- */
  const [trapTab, setTrapTab] = useState(true);
  const onContentKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setTrapTab(false);
      return;
    }
    if (e.key === 'Tab' && trapTab && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.setRangeText('  ', e.currentTarget.selectionStart, e.currentTarget.selectionEnd, 'end');
      e.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const onFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <form onSubmit={submit} onKeyDown={onFormKeyDown} noValidate className="space-y-5">
      <Field label="Title" error={errors.title?.message}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            {...register('title')}
            maxLength={LIMITS.title}
            placeholder="e.g. Recursive grep"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Description" optional error={errors.description?.message}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            {...register('description')}
            maxLength={LIMITS.description}
            placeholder="What does it do, when do you need it?"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" error={errors.categoryId?.message}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} {...register('categoryId')} aria-describedby={describedBy} invalid={invalid}>
              <option value="" disabled>
                Pick a category…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Language" error={errors.language?.message}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} {...register('language')} aria-describedby={describedBy} invalid={invalid}>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field
        label="Content"
        error={errors.content?.message}
        hint={
          <>
            The command, code or fix. <Kbd>Tab</Kbd> indents; press <Kbd>Esc</Kbd> then <Kbd>Tab</Kbd> to move
            on.
          </>
        }
      >
        {({ id, describedBy, invalid }) => {
          const { onBlur, ...field } = register('content');
          return (
            <textarea
              id={id}
              {...field}
              onBlur={(e) => {
                setTrapTab(true);
                return onBlur(e);
              }}
              onKeyDown={onContentKeyDown}
              rows={10}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={'grep -R "pattern" .'}
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              className={inputClass(invalid, 'min-h-48 resize-y font-mono text-[13px] leading-relaxed')}
            />
          );
        }}
      </Field>

      <Field
        label="Tags"
        optional
        error={errors.tags?.message ?? errors.tags?.find?.((e) => e)?.message}
        hint={`Press Enter or comma to add. Up to ${LIMITS.tags}.`}
      >
        {({ id, describedBy, invalid }) => (
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput
                id={id}
                value={field.value ?? []}
                onChange={field.onChange}
                onBlur={field.onBlur}
                suggestions={tags.map((t) => t.name)}
                invalid={invalid}
                describedBy={describedBy}
              />
            )}
          />
        )}
      </Field>

      <Field label="Source URL" optional error={errors.sourceUrl?.message}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            type="url"
            inputMode="url"
            {...register('sourceUrl')}
            placeholder="https://…"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Controller
        control={control}
        name="isFavorite"
        render={({ field }) => (
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-medium select-none">
            <input
              type="checkbox"
              checked={Boolean(field.value)}
              onChange={(e) => field.onChange(e.target.checked)}
              onBlur={field.onBlur}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                'flex size-8 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-indigo-500',
                field.value
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                  : 'border-zinc-300 dark:border-zinc-700',
              )}
            >
              <Star
                className={cn('size-4', field.value ? 'fill-amber-400 text-amber-400' : 'text-zinc-400')}
              />
            </span>
            Favorite
          </label>
        )}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:items-center dark:border-zinc-800">
        <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
          <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to save
        </p>
        <div className="flex gap-2 sm:ml-auto">
          <ButtonLink to={cancelTo} className="flex-1 sm:flex-none">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1 sm:flex-none">
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        title="Discard unsaved changes?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      >
        You have changes that haven’t been saved. If you leave now they’ll be lost.
      </ConfirmDialog>
    </form>
  );
}
