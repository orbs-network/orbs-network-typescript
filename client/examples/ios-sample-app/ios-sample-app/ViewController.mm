#import "ViewController.h"

#import "../../../crypto-sdk/lib/crypto.h"
#import "../../../crypto-sdk/lib/address.h"
#import "../../../crypto-sdk/lib/utils.h"

using namespace std;
using namespace Orbs;

static NSString *VIRTUAL_CHAIN_ID(@"640ed3");
static NSString *MAIN_NETWORK_ID(@"M");
static NSString *TEST_NETWORK_ID(@"T");

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

- (NSString *)generateAddress:(NSString *)networkId {
    const string virtualChainId([VIRTUAL_CHAIN_ID cStringUsingEncoding:[NSString defaultCStringEncoding]]);
    const string network([networkId cStringUsingEncoding:[NSString defaultCStringEncoding]]);
    
    ED25519Key key;
    Address address(Utils::Vec2Hex(key.GetPublicKey()), virtualChainId, network);
    return [NSString stringWithCString:address.ToString().c_str() encoding:[NSString defaultCStringEncoding]];
}

- (IBAction)onGenerateAddressButtonClicked:(id)sender {
    NSString *networkId;
    
    switch (_networkIdControl.selectedSegmentIndex) {
        // Testnet
        case 0: {
            networkId = TEST_NETWORK_ID;
            break;
        }
            
        // Mainnet
        case 1: {
            networkId = MAIN_NETWORK_ID;
            break;
        }
    }
    
    NSString *publicAddress = [self generateAddress:networkId];
    [self.addressTextField setText:publicAddress];
}

- (IBAction)onNetworkIdChanged:(id)sender {
    [self.addressTextField setText:@""];
    
    UISegmentedControl *segmentedControl = (UISegmentedControl *)sender;
    
    switch (segmentedControl.selectedSegmentIndex) {
        // Testnet
        case 0: {
            NSString *publicAddress = [self generateAddress:TEST_NETWORK_ID];
            [self.addressTextField setText:publicAddress];
            break;
        }
            
        // Mainnet
        case 1: {
            NSString *publicAddress = [self generateAddress:MAIN_NETWORK_ID];
            [self.addressTextField setText:publicAddress];
            break;
        }
    }
}

@end
