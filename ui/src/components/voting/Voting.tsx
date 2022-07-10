import React, { useEffect, useCallback, useState } from 'react';

import {
  Text,
  Box,
  Heading,
  Button,
  Collapse,
  Input,
  Flex,
  Alert,
  Spinner,
  Divider,
  Container,
  useDisclosure,
  TabPanels,
  TabPanel,
  Tabs,
  TabList,
  Tab,
} from '@chakra-ui/react';

import { getAgeCheckContract, getVotingContract } from '@hooks/contractHelpers';
import { generateBroadcastParams } from '@utils/zk/zk-witness';
import { truncateAddress } from '@utils/wallet';
import { useWalletContext } from '@components/dapp/WalletContext';
import { ZkCircuit } from '@components/zk-circuit-card';
import { VotingItem } from './VotingItem';
import { CreatePollModal } from './CreatePollModal';
import { RegisterCommitmentModal } from './RegisterCommitmentModal';
import ActivePolls from './ActivePolls';
import MyPolls from './MyPolls';
import { Voting } from '@types/contracts/Voting';
import { PollStatus } from './types';

const VotingDapp = () => {
  const [age, setAge] = React.useState<number>(19);
  const [error, setError] = React.useState<string | undefined>();
  const [statusMsg, setStatusMsg] = React.useState<string | undefined>();
  const [isLoading, setLoading] = useState<boolean>(false);

  const [alert, setAlert] = React.useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [ageVerified, setAgeVerified] = React.useState<boolean>(false);
  const { chainId, provider, account } = useWalletContext();
  const [activePolls, setActivePolls] = React.useState<
    Voting.PollStructOutput[]
  >([]);
  const votingContract = React.useMemo(
    () => getVotingContract(chainId ?? 80001),
    [chainId],
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: openRegister,
    onOpen: onOpenRegister,
    onClose: onCloseRegister,
  } = useDisclosure();

  //   const getAgeVerificationStatus = useCallback(async () => {
  //     if (account == null || votingContract == null || chainId == null) {
  //       return;
  //     }

  //     const isVerified = await votingContract.getVerficationStatus(account);

  //     if (isVerified) {
  //       setAgeVerified(true);
  //     }
  //   }, [votingContract, account, chainId]);

  //   useEffect(() => {
  //     getAgeVerificationStatus();
  //   }, [account, getAgeVerificationStatus, chainId, votingContract]);

  useEffect(() => {
    if (votingContract == null || chainId == null || account == null) {
      return;
    }

    // (async () => {
    //   const pollIds = await votingContract.pollIdCounter();
    //   console.log('pollIds', pollIds);
    // })();

    getAllPolls();
  }, [chainId, account, votingContract]);

  const getAllPolls = async () => {
    if (votingContract == null) {
      return;
    }

    const activePolls = await votingContract.getAllPolls();
    setActivePolls(activePolls);
    console.log('activePolls', activePolls);
  };

  const handleVerify = async () => {
    if (votingContract == null || provider == null) {
      return;
    }
    setLoading(true);
    setStatusMsg('Generating Proof');
    try {
      const [a, b, c, input] = await generateBroadcastParams(
        {
          ...{
            ageLimit: 18,
            age,
          },
        },
        'voting',
      );
      setError(undefined);
      setStatusMsg('Proof Generated..');
      const proof = [...a, ...b[0], ...b[1], ...c];

      setStatusMsg('Verifying Proof..');
      try {
        // const tx = await votingContract
        //   .connect(provider.getSigner())
        //   .verifyUsingGroth(proof, input);
        // if (tx?.hash) {
        //   setAlert({
        //     open: true,
        //     message: `Transaction broadcasted with hash ${tx.hash}`,
        //   });
        // }
      } catch (e) {
        setAlert({
          open: true,
          message: `Error sending transaction. Please try again!`,
        });
        console.log(`Errror: ${e}`);
        setStatusMsg(undefined);
        setLoading(false);
      }
    } catch (e) {
      setError('Failed to generate proof, possibly age not valid.');
      setStatusMsg('Invalid proof');
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (votingContract == null || provider == null) {
      return;
    }
    try {
      //   const tx = await votingContract
      //     .connect(provider.getSigner())
      //     .setVerficationStatus(false);
      //   if (tx?.hash) {
      //     setAlert({
      //       open: true,
      //       message: `Transaction broadcasted with hash ${tx.hash}`,
      //     });
      //   }
    } catch (e) {
      setAlert({
        open: true,
        message: `Error sending transaction. Please try again!`,
      });
    }
  };
  //   const AgeVerfiedText = React.memo(() => {
  //     if (account == null) {
  //       return null;
  //     }
  //     return (
  //       <Text mb="8px">
  //         Age for<b> {truncateAddress(account) ?? ''} </b>{' '}
  //         {ageVerified ? 'is above 18.' : 'not verified.'}
  //       </Text>
  //     );
  //   });
  return (
    <div>
      <Box display="flex" flexDirection="row" justifyContent="center">
        <Collapse
          in={alert.open}
          style={{ margin: 0, padding: 0, width: '300px' }}
        >
          <Alert variant="subtle" status="success" sx={{ mb: 2 }}>
            <Text flexWrap={'wrap'} sx={{ wordBreak: 'break-word' }}>
              {alert.message}
            </Text>
          </Alert>
        </Collapse>
      </Box>
      <Container maxW="container.lg" pb="16px">
        <Box py="8px" color="gray.200">
          <Heading
            color="black"
            fontSize={['22px', '22px', '28px']}
            mb={['8px', '8px', '16px']}
          >
            Voting
          </Heading>
        </Box>
        <Divider />

        <Flex my={['8px', '16px']}>
          <Button
            variant="solid"
            bg="black"
            _hover={{ bg: 'gray.600' }}
            color="white"
            onClick={onOpenRegister}
            disabled={!account}
          >
            Register
          </Button>
          <Button
            variant="solid"
            bg="black"
            _hover={{ bg: 'gray.600' }}
            ml="24px"
            color="white"
            onClick={onOpen}
            // disabled={!account}
          >
            Create Poll
          </Button>
        </Flex>
        <Divider />

        <Tabs>
          <TabList>
            <Tab>Active Polls</Tab>
            <Tab>My Polls</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <ActivePolls
                polls={activePolls.filter(
                  (p) => p.pollStatus !== PollStatus.Created,
                )}
              />
            </TabPanel>
            <TabPanel>
              <MyPolls
                polls={activePolls.filter((p) => p.creator == account)}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* <Flex justifyContent="center">
          <Input
            id="outlined-basic"
            value={age}
            type="number"
            disabled={!account}
            onChange={(e) => setAge(Number(e.target.value ?? 0))}
            isInvalid={!!error}
            errorBorderColor="red.300"
            w="140px"
            style={{ marginRight: '8px' }}
          />

          <Button
            variant="solid"
            bg="black"
            _hover={{ bg: 'gray.600' }}
            color="white"
            onClick={handleVerify}
            disabled={!account}
          >
            Verify Age
          </Button>
        </Flex> */}
        {/* <Flex justifyContent="center" mt="8px">
          <Text fontSize="lg">{statusMsg}</Text>
          {isLoading && <Spinner />}
        </Flex> */}
      </Container>
      <CreatePollModal isOpen={isOpen} onClose={onClose} />
      <RegisterCommitmentModal
        key={'register-modal'}
        isOpen={openRegister}
        onClose={onCloseRegister}
      />
    </div>
  );
};

export default VotingDapp;
