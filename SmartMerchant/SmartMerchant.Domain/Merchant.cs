namespace SmartMerchant.Domain
{
    public class Merchant : Entity
    {
        // unique
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string LogoURL { get; set; } = string.Empty;
        public double Balance { get; set; } = 0.0;

        public Guid OwnerUserGuid { get; set; }
    }
}
