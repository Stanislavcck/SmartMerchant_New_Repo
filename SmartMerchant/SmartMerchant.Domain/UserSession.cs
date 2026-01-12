namespace SmartMerchant.Domain
{
    public class UserSession : Entity
    {
        public Guid UserGuid { get; set; }

        // unique
        public string Token { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpireAt { get; set; }
    }
}
