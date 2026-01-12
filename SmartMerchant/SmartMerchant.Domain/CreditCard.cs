namespace SmartMerchant.Domain
{
    public class CreditCard : Entity
    {
        public double Balance { get; set; } = 0.0;

        public string Number { get; set; } = string.Empty;
        public DateTime ExpirationDate { get; set; }
        public string CVV { get; set; } = string.Empty;

        public string HolderFirstName { get; set; } = string.Empty;
        public string HolderLastName { get; set; } = string.Empty;
    }
}
