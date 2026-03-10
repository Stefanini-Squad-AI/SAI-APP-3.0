namespace TuCreditoOnline.Application.Common.Models;

public class Result
{
    public bool IsSuccess { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public List<string> Errors { get; private set; } = new();

    protected Result(bool isSuccess, string message)
    {
        IsSuccess = isSuccess;
        Message = message;
    }

    protected Result(bool isSuccess, string message, List<string> errors) : this(isSuccess, message)
    {
        Errors = errors;
    }

    public static Result Success(string message = "Operation successful")
        => new(true, message);

    public static Result Failure(string message, List<string>? errors = null)
        => new(false, message, errors ?? new List<string>());

    public static Result<T> Success<T>(T data, string message = "Operation successful")
        => new(data, true, message);

    public static Result<T> Failure<T>(string message, List<string>? errors = null)
        => new(default!, false, message, errors ?? new List<string>());
}

public class Result<T> : Result
{
    public T Data { get; private set; }

    internal Result(T data, bool isSuccess, string message) : base(isSuccess, message)
    {
        Data = data;
    }

    internal Result(T data, bool isSuccess, string message, List<string> errors) : base(isSuccess, message, errors)
    {
        Data = data;
    }

    /// <summary>
    /// Creates a successful Result with data.
    /// Allows calling Result&lt;T&gt;.Success(data) directly.
    /// </summary>
    public static Result<T> Success(T data, string message = "Operation successful")
        => new(data, true, message);

    /// <summary>
    /// Creates a failed Result.
    /// Allows calling Result&lt;T&gt;.Failure(message) directly.
    /// Uses 'new' to explicitly hide the base class method with same signature.
    /// </summary>
    public new static Result<T> Failure(string message, List<string>? errors = null)
        => new(default!, false, message, errors ?? new List<string>());
}
