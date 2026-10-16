// NOTE: Third-party license notices, see THIRD_PARTY_NOTICES.txt. Keep them embedded.

#[used]
static NOTICES: [&str; 4] = [
  include_str!("../THIRD_PARTY_NOTICES.txt"),
  include_str!("../licenses/rust-crates.txt"),
  include_str!("../../../LICENSES/Apache-2.0.txt"),
  include_str!("../../../LICENSES/CC-BY-4.0.txt"),
];

/// Reads the notices once, so they stay in the binary even if `#[used]` alone doesn't keep them.
pub fn keep() {
  std::hint::black_box(&NOTICES);
}
