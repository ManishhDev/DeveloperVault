import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from '../components/entries/TagInput';
import { Highlight } from '../components/ui/Highlight';
import { timeAgo } from '../lib/utils';

function ControlledTagInput({ initial = [] as string[], suggestions = [] as string[] }) {
  const [tags, setTags] = useState(initial);
  return (
    <>
      <TagInput id="tags" value={tags} onChange={setTags} suggestions={suggestions} />
      <output data-testid="value">{tags.join('|')}</output>
    </>
  );
}

describe('TagInput', () => {
  it('adds normalized tags on Enter and comma, ignoring duplicates', async () => {
    const user = userEvent.setup();
    render(<ControlledTagInput />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'Docker{Enter}');
    await user.type(input, '#SSH Keys,');
    await user.type(input, 'docker{Enter}');

    expect(screen.getByTestId('value')).toHaveTextContent('docker|ssh-keys');
  });

  it('removes tags with the × button and Backspace', async () => {
    const user = userEvent.setup();
    render(<ControlledTagInput initial={['a', 'b', 'c']} />);

    await user.click(screen.getByRole('button', { name: 'Remove tag b' }));
    expect(screen.getByTestId('value')).toHaveTextContent('a|c');

    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('value')).toHaveTextContent(/^a$/);
  });

  it('autocompletes from existing tags with arrow keys', async () => {
    const user = userEvent.setup();
    render(<ControlledTagInput suggestions={['networking', 'network-debug', 'git']} />);

    await user.type(screen.getByRole('combobox'), 'netw');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '#networking',
      '#network-debug',
    ]);

    await user.keyboard('{ArrowDown}{Enter}');
    expect(screen.getByTestId('value')).toHaveTextContent('network-debug');
  });
});

describe('Highlight', () => {
  it('marks case-insensitive matches and treats the query literally', () => {
    const { container } = render(<Highlight text="Use grep -R or GREP (r)" query="grep" />);
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual(['grep', 'GREP']);

    const { container: c2 } = render(<Highlight text="a (r) b" query="(r)" />);
    expect(c2.querySelector('mark')?.textContent).toBe('(r)');
  });
});

describe('timeAgo', () => {
  it('formats relative times', () => {
    const now = Date.parse('2026-01-10T12:00:00Z');
    expect(timeAgo('2026-01-10T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-01-08T12:00:00Z', now)).toBe('2 days ago');
  });
});
