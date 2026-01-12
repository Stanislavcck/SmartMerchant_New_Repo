namespace SmartMerchant.Domain
{
    public class MerchantInvoice : Entity
    {
        // unique
        public string Number { get; set; } = string.Empty;
        public Guid MerchantGuid { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime DueAt { get; set; }
        public bool IsPaid { get; set; }

        public string PaidBy { get; set; } = string.Empty;
    }
}
