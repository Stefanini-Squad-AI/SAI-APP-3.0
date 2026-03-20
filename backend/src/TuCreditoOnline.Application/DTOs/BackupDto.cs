namespace TuCreditoOnline.Application.DTOs;

public sealed class BackupFileDto
{
    public string FileName { get; init; } = string.Empty;
    public long Size { get; init; }
    public DateTime CreatedAt { get; init; }
    public string SizeFormatted { get; init; } = string.Empty;
}

public sealed class BackupStatusDto
{
    public int TotalBackups { get; init; }
    public IReadOnlyList<BackupFileDto> Backups { get; init; } = [];
}
