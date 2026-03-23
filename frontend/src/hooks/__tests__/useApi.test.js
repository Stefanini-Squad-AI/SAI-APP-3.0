import { renderHook, act } from '@testing-library/react';
import useApi from '../useApi';

describe('useApi', () => {
  it('initialises with default state', () => {
    const mockFn = jest.fn();
    const { result } = renderHook(() => useApi(mockFn));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
  });

  it('sets loading to true while executing, then false on success', async () => {
    const responseData = { id: 1, name: 'Test' };
    const mockFn = jest.fn().mockResolvedValue(responseData);
    const { result } = renderHook(() => useApi(mockFn));

    let executePromise;
    act(() => {
      executePromise = result.current.execute();
    });
    // During execution loading should be true
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await executePromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(responseData);
    expect(result.current.error).toBeNull();
  });

  it('returns the resolved value from execute()', async () => {
    const responseData = { value: 42 };
    const mockFn = jest.fn().mockResolvedValue(responseData);
    const { result } = renderHook(() => useApi(mockFn));

    let returned;
    await act(async () => {
      returned = await result.current.execute('arg1', 'arg2');
    });

    expect(returned).toEqual(responseData);
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('passes arguments through to the wrapped function', async () => {
    const mockFn = jest.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useApi(mockFn));

    await act(async () => {
      await result.current.execute('a', 'b', 'c');
    });

    expect(mockFn).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('sets error state and re-throws on failure', async () => {
    const err = new Error('network failure');
    const mockFn = jest.fn().mockRejectedValue(err);
    const { result } = renderHook(() => useApi(mockFn));

    let caughtError;
    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        caughtError = e;
      }
    });

    expect(caughtError).toBe(err);
    expect(result.current.error).toBe(err);
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('clears error state on a subsequent successful call', async () => {
    const err = new Error('oops');
    const mockFn = jest.fn()
      .mockRejectedValueOnce(err)
      .mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useApi(mockFn));

    // First call – fails; catch inside act so the error doesn't escape
    await act(async () => {
      try {
        await result.current.execute();
      } catch {
        // expected
      }
    });

    expect(result.current.error).toBe(err);

    // Second call – succeeds
    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ ok: true });
  });

  it('execute is stable (same reference) across re-renders when apiFunction does not change', () => {
    const mockFn = jest.fn();
    const { result, rerender } = renderHook(() => useApi(mockFn));

    const firstExecute = result.current.execute;
    rerender();
    expect(result.current.execute).toBe(firstExecute);
  });
});
