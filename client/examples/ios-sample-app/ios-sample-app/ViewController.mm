#import "ViewController.h"

#import "../../../crypto-sdk/lib/crypto.h"
#import "../../../crypto-sdk/lib/address.h"
#import "../../../crypto-sdk/lib/utils.h"

using namespace std;
using namespace Orbs;

static const string VIRTUAL_CHAIN_ID("640ed3");
static const string TEST_NETWORK_ID("T");

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    CryptoSDK::Init();
    
    [super viewDidLoad];
    // Do any additional setup after loading the view, typically from a nib.
}


- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)onGenerateAddressButtonClick:(id)sender {
    ED25519Key key;
    Address address(Utils::Vec2Hex(key.GetPublicKey()), VIRTUAL_CHAIN_ID, TEST_NETWORK_ID);
    NSString *publicAddress = [NSString stringWithCString:address.ToString().c_str() encoding:[NSString defaultCStringEncoding]];
    [self.addressTextField setText:publicAddress];
}

@end
